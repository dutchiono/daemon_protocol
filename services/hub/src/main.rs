// services/hub/src/main.rs
use anyhow::Result;
use clap::Parser;
use libp2p::{
    gossipsub, kad, noise, quic,
    swarm::{NetworkBehaviour, SwarmBuilder, SwarmEvent},
    PeerId, Swarm,
};
use prometheus::{Encoder, TextEncoder, register_counter, register_histogram};
use std::time::Duration;
use tokio::time;
use tracing::{info, warn, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod crypto;
mod message;
mod rate_limiter;
mod storage;

use config::Config;
use message::{Message, MessageValidator};
use rate_limiter::RateLimiter;

#[derive(Parser)]
#[clap(name = "daemon-hub", version)]
struct Cli {
    #[clap(short, long, default_value = "config.toml")]
    config: String,
}

#[derive(NetworkBehaviour)]
struct DaemonBehaviour {
    gossipsub: gossipsub::Behaviour,
    kademlia: kad::Behaviour<kad::store::MemoryStore>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "hub=info,libp2p=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cli = Cli::parse();
    let config = Config::load(&cli.config)?;

    info!("Starting daemon-hub");
    info!("Peer ID: {}", config.peer_id);

    // Initialize Prometheus metrics
    let messages_received = register_counter!(
        "daemon_messages_received_total",
        "Total number of messages received"
    )?;
    let messages_validated = register_counter!(
        "daemon_messages_validated_total",
        "Total number of messages validated"
    )?;
    let message_latency = register_histogram!(
        "daemon_message_latency_seconds",
        "Message processing latency"
    )?;

    // Build libp2p swarm
    let mut swarm = create_swarm(&config).await?;

    // Listen on all interfaces
    swarm.listen_on(
        format!("/ip4/0.0.0.0/udp/{}/quic-v1", config.port)
            .parse()?
    )?;

    // Bootstrap Kademlia DHT
    if let Some(bootstrap_peers) = &config.bootstrap_peers {
        for peer in bootstrap_peers {
            swarm.behaviour_mut().kademlia.add_address(
                &peer.peer_id,
                peer.address.clone(),
            );
        }
        swarm.behaviour_mut().kademlia.bootstrap()?;
    }

    // Subscribe to topics
    for topic in &config.topics {
        let topic_hash = gossipsub::IdentTopic::new(topic);
        swarm.behaviour_mut().gossipsub.subscribe(&topic_hash)?;
        info!("Subscribed to topic: {}", topic);
    }

    let validator = MessageValidator::new();
    let mut rate_limiter = RateLimiter::new(
        config.rate_limit_burst,
        config.rate_limit_refill_rate,
    );

    // Main event loop
    let mut metrics_interval = time::interval(Duration::from_secs(60));
    
    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::Behaviour(event) => handle_behaviour_event(
                        event,
                        &validator,
                        &mut rate_limiter,
                        &messages_received,
                        &messages_validated,
                        &message_latency,
                    ).await,
                    SwarmEvent::NewListenAddr { address, .. } => {
                        info!("Listening on {}", address);
                    }
                    SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                        info!("Connected to peer: {}", peer_id);
                    }
                    SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                        warn!("Connection closed to {}: {:?}", peer_id, cause);
                    }
                    _ => {}
                }
            }
            _ = metrics_interval.tick() => {
                export_metrics().await?;
            }
        }
    }
}

async fn create_swarm(config: &Config) -> Result<Swarm<DaemonBehaviour>> {
    let keypair = config.load_keypair()?;
    let peer_id = PeerId::from(keypair.public());

    // Configure GossipSub
    let gossipsub_config = gossipsub::ConfigBuilder::default()
        .heartbeat_interval(Duration::from_secs(1))
        .validation_mode(gossipsub::ValidationMode::Strict)
        .max_transmit_size(1024 * 1024) // 1MB
        .build()
        .map_err(|e| anyhow::anyhow!("GossipSub config error: {}", e))?;

    let gossipsub = gossipsub::Behaviour::new(
        gossipsub::MessageAuthenticity::Signed(keypair.clone()),
        gossipsub_config,
    )?;

    // Configure Kademlia DHT
    let store = kad::store::MemoryStore::new(peer_id);
    let kademlia = kad::Behaviour::new(peer_id, store);

    let behaviour = DaemonBehaviour {
        gossipsub,
        kademlia,
    };

    // Build swarm with QUIC transport
    let swarm = SwarmBuilder::with_existing_identity(keypair)
        .with_tokio()
        .with_quic()
        .with_behaviour(|_| behaviour)?
        .with_swarm_config(|c| {
            c.with_idle_connection_timeout(Duration::from_secs(60))
        })
        .build();

    Ok(swarm)
}

async fn handle_behaviour_event(
    event: DaemonBehaviourEvent,
    validator: &MessageValidator,
    rate_limiter: &mut RateLimiter,
    messages_received: &prometheus::Counter,
    messages_validated: &prometheus::Counter,
    message_latency: &prometheus::Histogram,
) {
    match event {
        DaemonBehaviourEvent::Gossipsub(gossipsub::Event::Message {
            propagation_source,
            message,
            ..
        }) => {
            let timer = message_latency.start_timer();
            messages_received.inc();

            // Rate limiting
            if !rate_limiter.check_and_update(&propagation_source) {
                warn!("Rate limit exceeded for peer: {}", propagation_source);
                return;
            }

            // Parse and validate message
            match serde_json::from_slice::<Message>(&message.data) {
                Ok(msg) => {
                    if validator.validate(&msg).await.is_ok() {
                        messages_validated.inc();
                        info!(
                            "Valid message from {}: type={}, fid={}",
                            propagation_source, msg.msg_type, msg.fid
                        );
                        // TODO: Store in database, forward to subscribers
                    } else {
                        warn!("Invalid message signature from {}", propagation_source);
                    }
                }
                Err(e) => {
                    error!("Failed to parse message: {}", e);
                }
            }

            timer.observe_duration();
        }
        DaemonBehaviourEvent::Kademlia(kad::Event::RoutingUpdated {
            peer,
            ..
        }) => {
            info!("Routing updated for peer: {}", peer);
        }
        DaemonBehaviourEvent::Kademlia(kad::Event::BootstrapResult(result)) => {
            match result {
                Ok(_) => info!("DHT bootstrap successful"),
                Err(e) => error!("DHT bootstrap failed: {}", e),
            }
        }
        _ => {}
    }
}

async fn export_metrics() -> Result<()> {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer)?;
    
    // In production, expose this via HTTP endpoint
    info!("Metrics snapshot: {} bytes", buffer.len());
    Ok(())
}

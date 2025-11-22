#!/usr/bin/env python3
import argparse
import json
import math
from pathlib import Path

# Uniswap V4 base constant
BASE = 1.0001


def round_to_spacing(tick: float, spacing: int) -> int:
    """Nearest multiple of spacing (handles negative ticks)."""
    return int(round(tick / spacing)) * spacing


def tick_from_price_daemon_per_token(price_daemon_per_token: float) -> float:
    """
    Calculate the tick for a given price of DAEMON per new token.

    When new token is token0 and DAEMON is token1:
    - price = amount_token1 / amount_token0 = DAEMON_per_newtoken
    - tick = log(price) / log(1.0001)

    For low FDV tokens (cheap new token), price_daemon_per_token is small,
    resulting in a negative tick.
    """
    return math.log(price_daemon_per_token, BASE)


def approx_fdv_at_tick(
    base_fdv_usd: float,
    base_tick: float,
    target_tick: int,
) -> float:
    """Scale FDV by the tick delta."""
    return base_fdv_usd * (BASE ** (target_tick - base_tick))


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Compute new token/DAEMON launch ticks for a target FDV and live DAEMON price. "
            "Outputs to ticks.json config file and displays calculated values."
        )
    )
    parser.add_argument(
        "--fdv-usd",
        "-f",
        type=float,
        required=True,
        help="Target fully diluted valuation in USD (e.g. 40000)",
    )
    parser.add_argument(
        "--daemon-usd",
        type=float,
        required=True,
        help="Spot price of 1 DAEMON in USD (e.g. 0.00006343)",
    )
    parser.add_argument(
        "--supply",
        type=float,
        default=100_000_000_000,
        help="Total token supply (default: 100_000_000_000)",
    )
    parser.add_argument(
        "--spacing",
        type=int,
        default=200,
        help="tickSpacing for the pool (default: 200)",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=110_400,
        help="Tick width for the liquidity position (default: 110400)",
    )
    parser.add_argument(
        "--daemon-supply",
        type=float,
        default=100_000_000_000,
        help="Total DAEMON token supply (default: 100_000_000_000)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Output file path (default: daemon/scripts/ticks.json)",
    )
    parser.add_argument(
        "--no-file",
        action="store_true",
        help="Don't write file, just print values",
    )

    args = parser.parse_args()

    # Calculate DAEMON market cap
    daemon_market_cap = args.daemon_usd * args.daemon_supply

    # Calculate the price of new token in USD and in DAEMON
    price_usd = args.fdv_usd / args.supply
    price_daemon = price_usd / args.daemon_usd

    # Calculate the raw tick
    raw_tick = tick_from_price_daemon_per_token(price_daemon)

    # Round to tick spacing
    starting_tick = round_to_spacing(raw_tick, args.spacing)

    # Calculate tick bounds for liquidity position
    tick_lower = starting_tick
    tick_upper = tick_lower + args.width

    # Calculate approximate FDVs at the bounds
    fdv_at_lower = approx_fdv_at_tick(args.fdv_usd, raw_tick, tick_lower)
    fdv_at_upper = approx_fdv_at_tick(args.fdv_usd, raw_tick, tick_upper)

    # Prepare output data
    tick_config = {
        "starting_tick": int(starting_tick),
        "tick_lower": int(tick_lower),
        "tick_upper": int(tick_upper),
        "tick_spacing": args.spacing,
        "target_fdv_usd": args.fdv_usd,
        "daemon_price_usd": args.daemon_usd,
        "raw_tick": raw_tick,
        "price_usd": price_usd,
        "price_daemon": price_daemon,
        "fdv_at_lower": fdv_at_lower,
        "fdv_at_upper": fdv_at_upper,
    }

    # Display calculated values
    print("=" * 60)
    print("DAEMON Token Launch Tick Calculator")
    print("=" * 60)
    print()
    print("Inputs:")
    print(f"  FDV USD          : ${args.fdv_usd:,.2f}")
    print(f"  DAEMON/USD price : ${args.daemon_usd:,.8f}")
    print(f"  DAEMON Market Cap : ${daemon_market_cap:,.0f}")
    print(f"  Supply           : {args.supply:,.0f}")
    print(f"  tickSpacing      : {args.spacing}")
    print(f"  width            : {args.width}")
    print()
    print("Calculated values:")
    print(f"  Token price USD  : ${price_usd:,.10f}")
    print(f"  Token price DAEMON: {price_daemon:,.6f} DAEMON")
    print(f"  Raw tick          : {raw_tick:.2f}")
    print()
    print("Pool configuration:")
    print(f"  Starting tick     : {starting_tick}")
    print(f"  Tick lower        : {tick_lower}")
    print(f"  Tick upper        : {tick_upper}")
    print(f"  FDV at lower      : ${fdv_at_lower:,.0f}")
    print(f"  FDV at upper      : ${fdv_at_upper:,.0f}")
    print()

    # Write to file if requested
    if not args.no_file:
        # Determine output file
        if args.output:
            output_file = Path(args.output)
        else:
            # Default: daemon/backend/src/config/ticks.json
            script_dir = Path(__file__).parent.resolve()
            # Script is in daemon/scripts/, so backend config is ../backend/src/config/
            output_file = script_dir.parent / "backend" / "src" / "config" / "ticks.json"

        # Write JSON file
        with open(output_file, "w") as f:
            json.dump(tick_config, f, indent=2)

        print(f"✅ Written to: {output_file}")
        print()
        print("Examples:")
        print("  # Base mainnet (DAEMON ~$0.000126, target 30k FDV):")
        print("  python3 scripts/daemon_launch_ticks.py -f 30000 --daemon-usd 0.000126")
        print()
        print("  # Base Sepolia (DAEMON ~$0.0018, target 180k FDV):")
        print("  python3 scripts/daemon_launch_ticks.py -f 180000 --daemon-usd 0.0018")
    else:
        print("(Skipped writing file - use --no-file to suppress this message)")


if __name__ == "__main__":
    main()

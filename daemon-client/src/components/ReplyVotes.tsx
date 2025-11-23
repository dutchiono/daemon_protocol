import { useEffect, useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { voteReply } from '../api/client';
import { useWallet } from '../wallet/WalletProvider';
import './ReplyVotes.css';

interface ReplyVotesProps {
  replyHash: string;
  initialVoteCount: number;
  initialVote?: 'UP' | 'DOWN' | null;
}

// Simple usePrevious hook
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function ReplyVotes({
  replyHash,
  initialVoteCount,
  initialVote,
}: ReplyVotesProps) {
  const { did } = useWallet();
  const queryClient = useQueryClient();
  const [votesAmt, setVotesAmt] = useState<number>(initialVoteCount);
  const [currentVote, setCurrentVote] = useState<'UP' | 'DOWN' | null | undefined>(initialVote);
  const prevVote = usePrevious(currentVote);

  // Ensure sync with server
  useEffect(() => {
    setCurrentVote(initialVote);
    setVotesAmt(initialVoteCount);
  }, [initialVote, initialVoteCount]);

  const { mutate: vote, isPending } = useMutation({
    mutationFn: async (voteType: 'UP' | 'DOWN') => {
      if (!did) {
        throw new Error('Wallet not connected');
      }
      return await voteReply(did, replyHash, voteType);
    },
    onError: (err, voteType) => {
      // Revert optimistic update
      if (voteType === 'UP') {
        setVotesAmt((prev) => prev - 1);
      } else {
        setVotesAmt((prev) => prev + 1);
      }

      // Reset current vote
      setCurrentVote(prevVote);

      console.error('Reply vote failed:', err);
    },
    onSuccess: (data) => {
      // Update vote count from server response if available
      if (data.votes?.voteCount !== undefined) {
        setVotesAmt(data.votes.voteCount);
      }

      // Update current vote
      if (data.voteType) {
        setCurrentVote(data.voteType);
      } else {
        setCurrentVote(null);
      }

      // Invalidate queries to refetch reply data
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
    onMutate: (voteType: 'UP' | 'DOWN') => {
      // Optimistic update
      if (currentVote === voteType) {
        // User is voting the same way again, so remove their vote
        setCurrentVote(null);
        if (voteType === 'UP') {
          setVotesAmt((prev) => prev - 1);
        } else if (voteType === 'DOWN') {
          setVotesAmt((prev) => prev + 1);
        }
      } else {
        // User is voting (or changing vote)
        setCurrentVote(voteType);
        if (voteType === 'UP') {
          setVotesAmt((prev) => prev + (currentVote ? 2 : 1));
        } else if (voteType === 'DOWN') {
          setVotesAmt((prev) => prev - (currentVote ? 2 : 1));
        }
      }
    },
  });

  const handleUpvote = () => {
    if (!did || isPending) return;
    vote('UP');
  };

  const handleDownvote = () => {
    if (!did || isPending) return;
    vote('DOWN');
  };

  return (
    <div className="reply-votes">
      <button
        onClick={handleUpvote}
        disabled={!did || isPending}
        className={`vote-button upvote ${currentVote === 'UP' ? 'active' : ''}`}
        aria-label="upvote reply"
        title={!did ? 'Connect wallet to vote' : 'Upvote'}
      >
        <ArrowBigUp className={`vote-icon small ${currentVote === 'UP' ? 'voted' : ''}`} />
      </button>

      <span className="vote-count small">{votesAmt}</span>

      <button
        onClick={handleDownvote}
        disabled={!did || isPending}
        className={`vote-button downvote ${currentVote === 'DOWN' ? 'active' : ''}`}
        aria-label="downvote reply"
        title={!did ? 'Connect wallet to vote' : 'Downvote'}
      >
        <ArrowBigDown className={`vote-icon small ${currentVote === 'DOWN' ? 'voted' : ''}`} />
      </button>
    </div>
  );
}


import { useNavigate } from 'react-router-dom';
import { useWallet } from '../wallet/WalletProvider';
import PostComposer from '../components/PostComposer';
import './Compose.css';

export default function Compose() {
  const navigate = useNavigate();
  const { fid } = useWallet();

  return (
    <div className="compose-page">
      <div className="compose-header">
        <h2>Compose</h2>
      </div>
      <PostComposer
        fid={fid}
        onPostCreated={() => navigate('/')}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}


import { ethers } from 'ethers';
import { IdentityRegistry__factory, type IdentityRegistry } from '../../../contracts/typechain-types';

// Contract address - should be in env or config
// For now, we'll need to get this from deployment or env
const ID_REGISTRY_ADDRESS = import.meta.env.VITE_ID_REGISTRY_ADDRESS || '';

// Base Sepolia RPC
const RPC_URL = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

export async function getIdentityRegistryContract(
  provider: ethers.Provider | ethers.Signer
): Promise<IdentityRegistry | null> {
  if (!ID_REGISTRY_ADDRESS) {
    console.warn('ID_REGISTRY_ADDRESS not configured. Please set VITE_ID_REGISTRY_ADDRESS in .env');
    return null;
  }
  return IdentityRegistry__factory.connect(ID_REGISTRY_ADDRESS, provider);
}

export async function getFIDFromAddress(
  provider: ethers.Provider,
  address: string
): Promise<number | null> {
  try {
    const contract = await getIdentityRegistryContract(provider);
    if (!contract) {
      return null; // Contract not deployed yet
    }
    const fid = await contract.getFID(address);
    return fid === 0n ? null : Number(fid);
  } catch (error) {
    console.error('Error getting FID from address:', error);
    return null;
  }
}

export async function registerFID(signer: ethers.Signer): Promise<number> {
  const contract = await getIdentityRegistryContract(signer);
  if (!contract) {
    throw new Error('ID Registry contract not deployed. Please set VITE_ID_REGISTRY_ADDRESS in .env');
  }
  const tx = await contract.register();
  await tx.wait();
  const fid = await contract.getFID(await signer.getAddress());
  return Number(fid);
}

export async function checkFIDExists(
  provider: ethers.Provider,
  fid: number
): Promise<boolean> {
  try {
    const contract = await getIdentityRegistryContract(provider);
    if (!contract) {
      return false;
    }
    return await contract.fidExists(fid);
  } catch (error) {
    console.error('Error checking FID existence:', error);
    return false;
  }
}


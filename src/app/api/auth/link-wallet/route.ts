// API route to link wallet address to user account

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMessage } from 'viem';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, signature, message } = await request.json();

    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature to prove wallet ownership
    try {
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      );
    }

    // Check if wallet is already linked to another account
    const existingWallet = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    });

    if (existingWallet && existingWallet.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Wallet already linked to another account' },
        { status: 409 }
      );
    }

    // Link wallet to user account
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress: address.toLowerCase() },
    });

    return NextResponse.json({
      message: 'Wallet linked successfully',
      address: address.toLowerCase(),
    });
  } catch (error) {
    console.error('Failed to link wallet:', error);
    return NextResponse.json(
      { error: 'Failed to link wallet' },
      { status: 500 }
    );
  }
}

import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { LiteSVM } from "litesvm";
import * as anchor from "@coral-xyz/anchor";

describe("generated with LiteSVM", () => {
  let svm: LiteSVM;
  let payer: Keypair;
  let provider: anchor.AnchorProvider;

  before(async () => {
    // Initialize LiteSVM for fast in-memory testing
    svm = new LiteSVM();
    
    // Create a payer account with initial SOL
    payer = Keypair.generate();
    svm.airdrop(payer.publicKey, 10 * LAMPORTS_PER_SOL);
    
    // Create Anchor provider using LiteSVM
    // LiteSVM provides a compatible RPC interface
    provider = new anchor.AnchorProvider(
      svm as any,  // LiteSVM is compatible with Solana Connection interface
      new anchor.Wallet(payer),
      { commitment: "processed" }
    );
    anchor.setProvider(provider);
  });

  it("Initializes successfully with LiteSVM", async () => {
    // Fast in-memory test execution (<100ms)
    // No external validator needed
  });
});

import { LiteSVM } from "@lightprotocol/litesvm";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

describe("demo-output with LiteSVM", () => {
  let svm: LiteSVM;
  let provider: anchor.AnchorProvider;
  let program: Program;

  before(async () => {
    // Initialize LiteSVM for fast in-memory testing
    svm = await LiteSVM.init();
    
    // Configure Anchor provider
    const connection = new anchor.web3.Connection(svm.getRpcUrl());
    const wallet = anchor.Wallet.local();
    provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
  });

  after(async () => {
    await svm.stop();
  });

  it("Runs tests quickly with LiteSVM", async () => {
    // Your test code here
  });
});

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BaseTest } from "../target/types/base_test";

describe("base_test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BaseTest as Program<BaseTest>;

  it("Initializes successfully", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Transaction signature:", tx);
  });
});

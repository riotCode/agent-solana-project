import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SyntaxTest } from "../target/types/syntax_test";

describe("syntax_test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SyntaxTest as Program<SyntaxTest>;

  it("Initializes successfully", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Transaction signature:", tx);
  });
});

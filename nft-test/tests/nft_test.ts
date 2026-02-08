import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftTest } from "../target/types/nft_test";

describe("nft_test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftTest as Program<NftTest>;

  it("Initializes successfully", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Transaction signature:", tx);
  });
});

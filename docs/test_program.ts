/**
 * test_program
 * Program ID: 11111111111111111111111111111111
 */

export type TestProgram = {
  version: "0.1.0";
  name: "test_program";
  instructions: [
    {
      name: "initialize";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true; }
      ];
      args: [
      ];
    },
    {
      name: "transfer";
      accounts: [
        { name: "from"; isMut: true; isSigner: true; }
        { name: "to"; isMut: true; isSigner: false; }
      ];
      args: [
        { name: "amount"; type: "u64"; }
      ];
    },
  ];
};

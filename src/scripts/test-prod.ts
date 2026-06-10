async function main() {
  const url = "https://integrated-halal-supply-chain.vercel.app/api/dss/ahp?type=LEVEL1_CP";
  console.log("Fetching", url);
  const res = await fetch(url);
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
main().catch(console.error);

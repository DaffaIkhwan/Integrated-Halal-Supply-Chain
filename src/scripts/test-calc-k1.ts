import { POST } from '../app/api/dss/ahp/calculate-k1/route';

async function main() {
  const res = await POST();
  const json = await res.json();
  console.log(json);
}
main().catch(console.error);

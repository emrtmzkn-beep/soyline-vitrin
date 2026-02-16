import { redirect } from 'next/navigation';

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.sire_id) query.set('sire_id', String(params.sire_id));
  if (params?.dam_id) query.set('dam_id', String(params.dam_id));

  const rawGen = Number.parseInt(String(params?.gen ?? '5'), 10);
  const safeGen = [3, 5].includes(rawGen) ? rawGen : 5;
  query.set('gen', String(safeGen));

  redirect(`/pedigri/muhtemel?${query.toString()}`);
}

import { prisma } from "@/lib/prisma";

async function getMetrics() {
  const [advertisers, publishers, campaigns, events, deliveries] = await Promise.all([
    prisma.advertiser.count(),
    prisma.publisher.count(),
    prisma.campaign.count(),
    prisma.adEvent.count(),
    prisma.webhookDelivery.count(),
  ]);

  const recentEvents = await prisma.adEvent.findMany({
    orderBy: { ts: "desc" },
    take: 8,
    select: {
      id: true,
      eventType: true,
      ts: true,
      publisher: { select: { siteName: true } },
      adUnit: { select: { key: true } },
    },
  });

  const recentDeliveries = await prisma.webhookDelivery.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      status: true,
      responseStatus: true,
      attempt: true,
      targetUrl: true,
      createdAt: true,
      event: { select: { eventType: true } },
    },
  });

  return { advertisers, publishers, campaigns, events, deliveries, recentEvents, recentDeliveries };
}

export default async function DashboardPage() {
  const { advertisers, publishers, campaigns, events, deliveries, recentEvents, recentDeliveries } =
    await getMetrics();

  const cards = [
    { label: "Advertisers", value: advertisers },
    { label: "Publishers", value: publishers },
    { label: "Campaigns", value: campaigns },
    { label: "Events", value: events },
    { label: "Webhooks", value: deliveries },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="text-sm text-slate-400">X402 · Admin</div>
          <h1 className="text-3xl font-semibold">Ad Platform Dashboard</h1>
          <p className="text-sm text-slate-400">
            Prisma-backed metrics for advertisers, publishers, campaigns, and ad events.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-sm text-slate-400">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold text-sky-200">{card.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Recent events</div>
                <p className="text-sm text-slate-400">Latest tracked ad events (max 8).</p>
              </div>
            </div>
            <div className="overflow-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900">
                  <tr className="text-left text-slate-300">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Publisher</th>
                    <th className="px-4 py-3">Ad Unit</th>
                    <th className="px-4 py-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((evt) => (
                    <tr key={evt.id} className="border-t border-slate-800/60">
                      <td className="px-4 py-3 text-slate-200">
                        {new Date(evt.ts).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-sky-200">{evt.eventType}</td>
                      <td className="px-4 py-3 text-slate-300">{evt.publisher?.siteName ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{evt.adUnit?.key ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-500">{evt.id.slice(0, 8)}…</td>
                    </tr>
                  ))}
                  {recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        No events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Recent webhooks</div>
                <p className="text-sm text-slate-400">Latest webhook deliveries (max 6).</p>
              </div>
            </div>
            <div className="overflow-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900">
                  <tr className="text-left text-slate-300">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Attempt</th>
                    <th className="px-4 py-3">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.map((d) => (
                    <tr key={d.id} className="border-t border-slate-800/60">
                      <td className="px-4 py-3 text-slate-200">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-sky-200">{d.status}</td>
                      <td className="px-4 py-3 text-slate-300">{d.event?.eventType ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{d.attempt}</td>
                      <td className="px-4 py-3 text-slate-300">{d.responseStatus ?? "-"}</td>
                    </tr>
                  ))}
                  {recentDeliveries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        No webhooks yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

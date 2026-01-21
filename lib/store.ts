import { AdEventInput, AdvertiserInput, PublisherInput } from "./types";

type Advertiser = AdvertiserInput & { id: string; apiKey: string };
type Publisher = PublisherInput & { id: string; appId: string; apiKey: string };
type AdEvent = AdEventInput & { id: string; recordedAt: number };

const store = {
  advertisers: [] as Advertiser[],
  publishers: [] as Publisher[],
  events: [] as AdEvent[],
};

const id = () => crypto.randomUUID();
const token = () => Buffer.from(crypto.randomUUID()).toString("base64url");

export function addAdvertiser(input: AdvertiserInput): Advertiser {
  const advertiser: Advertiser = {
    ...input,
    id: `adv_${id()}`,
    apiKey: `adv_${token()}`,
  };
  store.advertisers.push(advertiser);
  return advertiser;
}

export function addPublisher(input: PublisherInput): Publisher {
  const publisher: Publisher = {
    ...input,
    id: `pub_${id()}`,
    appId: `app_${token()}`,
    apiKey: `pub_${token()}`,
  };
  store.publishers.push(publisher);
  return publisher;
}

export function recordEvent(input: AdEventInput): AdEvent {
  const event: AdEvent = {
    ...input,
    id: `evt_${id()}`,
    recordedAt: Date.now(),
  };
  store.events.push(event);
  return event;
}

export function getSnapshot() {
  return store;
}

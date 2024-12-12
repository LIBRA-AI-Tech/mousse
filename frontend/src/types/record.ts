type Organization = {
  id: string,
  title: string,
}

type SpatialExtent = {
  north: number,
  east: number,
  south: number,
  west: number,
}

type TemporalExtent = {
  from: string,
  to: string,
}

type OnlineResource = {
  name?: string,
  description?: string,
  url: string,
}

export interface RecordDetails {
  title: string;
  description?: string;
  source: Organization;
  rights?: string[];
  keyword?: string[];
  where: SpatialExtent[];
  when?: TemporalExtent[];
  online?: OnlineResource[];
  topic?: string[];
}

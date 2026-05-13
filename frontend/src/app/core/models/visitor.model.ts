export interface Visitor {
  id: number;
  name: string;
  phone: string;
  purpose: string;
  flatToVisit: string;
  loggedById: number;
  loggedByName: string;
  entryTime: string;
  exitTime: string | null;
}

export interface CreateVisitorRequest {
  name: string;
  phone: string;
  purpose: string;
  flatToVisit: string;
}

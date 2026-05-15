import type { DataResponse } from "../responses";
import type { DomainsDkimKey } from "./dkim-create";

export interface DomainsDkimRotateOptions {
  newKey: {
    /**
     * Selector for the new key pair. Must be a maximum of 63 characters.
     */
    selector: string;
  };
}

export type DomainsDkimRotateResponse = DataResponse<{
  new: DomainsDkimKey;
  rotated: DomainsDkimKey;
}>;

import "pinia";

declare module "pinia" {
  export interface DefineStoreOptionsBase<_S, _Store> {
    /**
     * Enables persistence for this store.
     */
    persist?: boolean;
  }
}

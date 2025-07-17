export interface ListingResult<T>{
  data: T;
  page_size: number;
	page: number;
	total_count: number;
	total_pages: number;
}
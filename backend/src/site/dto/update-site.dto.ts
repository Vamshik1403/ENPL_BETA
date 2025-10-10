export class UpdateSiteDto {
  addressBookId?: number;
  siteName?: string;
  siteAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
  // Don't include contacts here
}
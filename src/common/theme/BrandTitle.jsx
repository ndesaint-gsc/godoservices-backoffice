import { Helmet } from 'react-helmet-async';
import { useBrandConfig } from './useBrand';

// Sets the browser tab title to the active brand's title. Until React mounts,
// the generic title from index.html is shown.
export default function BrandTitle() {
  const brand = useBrandConfig();
  return (
    <Helmet>
      <title>{brand.docTitle}</title>
    </Helmet>
  );
}

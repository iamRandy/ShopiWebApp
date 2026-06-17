import { memo } from "react";
import AddressBar from "./AddressBar";
import { useHostnameTypewriter } from "./useHostnameTypewriter";

function TypewriterAddressBar({ enabled = true }) {
  const hostname = useHostnameTypewriter({ enabled });
  const typedUrl = hostname ? `https://${hostname}` : "";

  return <AddressBar typedText={typedUrl} />;
}

export default memo(TypewriterAddressBar);

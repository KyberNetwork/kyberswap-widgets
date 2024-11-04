import { useEffect, useState } from "react";

export function useDeviceScreen(): {
  isMobile: boolean;
  isTablet: boolean;
} {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  const handleResize = (): void => {
    const width = window.innerWidth;
    setIsMobile(width <= 576);
    setIsTablet(width > 576 && width <= 1024);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    isMobile,
    isTablet,
  };
}

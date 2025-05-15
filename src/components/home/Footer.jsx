// /Users/duke/Documents/GitHub/RentKub/client/src/components/home/Footer.jsx
import { useState, useEffect, useRef } from "react"; // Import useEffect and useRef
import {
  Globe,
  Facebook,
  Twitter,
  Instagram,
  ChevronUp,
  ChevronDown,
} from "lucide-react"; // Import toggle icons
import { Button } from "@/components/ui/button"; // Import Button for the toggle

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isFooterVisible, setIsFooterVisible] = useState(false); // State to control visibility
  const [isFixed, setIsFixed] = useState(false); // State to control fixed positioning
  const footerRef = useRef(null); // Ref to the footer element
  const [footerHeight, setFooterHeight] = useState(0); // Store footer height for placeholder

  // Ref to store the natural top position of the footer when it's in normal flow
  const naturalTopPositionRef = useRef(0);

  useEffect(() => {
    const footerElement = footerRef.current;
    if (!footerElement) return;

    // Function to update the stored natural top position and current height
    // This should ideally be called when the footer is in its 'relative' (non-fixed) state
    // to get its correct position in the document flow.
    const updateFooterMetrics = () => {
      if (footerElement) {
        // Always update footerHeight state for the placeholder
        setFooterHeight(footerElement.offsetHeight);
        // Only update naturalTopPositionRef if the footer is not currently fixed,
        // or if it's the first run and we need an initial value.
        if (!isFixed || naturalTopPositionRef.current === 0) {
          const rect = footerElement.getBoundingClientRect();
          naturalTopPositionRef.current = rect.top + window.scrollY;
        }
      }
    };

    // Initial metrics update
    updateFooterMetrics();

    const handleScrollResize = () => {
      if (!footerElement) return;

      // Update footer height dynamically as it can change (e.g., expand/collapse)
      const currentDynamicFooterHeight = footerElement.offsetHeight;
      setFooterHeight(currentDynamicFooterHeight);

      // If the footer is not fixed, its natural top position might have changed
      // due to content resizing above it. So, we update it.
      if (!isFixed) {
        const rect = footerElement.getBoundingClientRect();
        naturalTopPositionRef.current = rect.top + window.scrollY;
      }

      // Use the stored natural top position and current dynamic height for the threshold
      const threshold =
        naturalTopPositionRef.current + currentDynamicFooterHeight;

      if (window.scrollY + window.innerHeight >= threshold) {
        if (!isFixed) setIsFixed(true); // Avoid unnecessary re-renders
      } else {
        if (isFixed) setIsFixed(false); // Avoid unnecessary re-renders
      }
    };

    window.addEventListener("scroll", handleScrollResize);
    window.addEventListener("resize", handleScrollResize); // Also handle window resize
    handleScrollResize(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScrollResize);
      window.removeEventListener("resize", handleScrollResize);
    };
    // Re-run effect if isFooterVisible changes (affects height) or isFixed changes (to update metrics correctly)
  }, [isFooterVisible, isFixed]);

  return (
    <>
      {/* Placeholder to prevent content jump when footer is fixed */}
      {isFixed && <div style={{ height: `${footerHeight}px` }} />}

      <footer
        ref={footerRef} // Attach the ref here
        className={`
          w-full z-40 hidden sm:block border-t border-gray-200 bg-white
          transition-all duration-300 ease-in-out {/* Transition for potential height changes */}
          ${
            isFixed
              ? "fixed bottom-0 left-0 right-0" // No margin when fixed
              : "relative mt-16" // Original margin when in flow
          } {/* Conditional fixed positioning */}
        `}
      >
        {/* Adjust vertical padding based on visibility */}
        <div
          className={`
          px-4 sm:px-6 lg:px-8 {/* Removed max-w-7xl and mx-auto */}
          ${
            isFooterVisible ? "py-4" : "py-1"
          } transition-all duration-300 ease-in-out`}
        >
          {/* Top Section: Link Categories */}
          <div
            className={`
          grid grid-cols-2 md:grid-cols-4 gap-8 mb-4
          transition-all duration-300 ease-in-out overflow-hidden ${
            isFooterVisible ? "max-h-72 opacity-100" : "max-h-0 opacity-0 mb-0"
          }`}
          >
            {" "}
            {/* Add transition and conditional classes */}
            {/* Support Column */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Safety information
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Cancellation options
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Report concern
                  </a>
                </li>
              </ul>
            </div>
            {/* Community Column */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Community
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    RentKub.org: disaster relief
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Support Afghan refugees
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Combating discrimination
                  </a>
                </li>
              </ul>
            </div>
            {/* Hosting Column */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Hosting
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Try hosting
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Explore hosting resources
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Visit community forum
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    How to host responsibly
                  </a>
                </li>
              </ul>
            </div>
            {/* RentKub Column */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                RentKub
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Newsroom
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Learn about new features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Investors
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section: Copyright, Social, etc. */}
          <div
            className={`border-t border-gray-200 pt-4 pb-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 ${
              isFooterVisible ? "" : "border-none pt-0"
            }`}
          >
            {" "}
            {/* Optionally adjust padding/border when top is hidden */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 md:mb-0">
              <span>© {currentYear} RentKub, Inc.</span>
              <span className="hidden sm:inline">·</span>
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Terms
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Sitemap
              </a>
            </div>
            <div className="flex items-center space-x-4 relative">
              {" "}
              {/* Added relative for button positioning if needed */}
              <button className="flex items-center hover:underline">
                <Globe className="h-4 w-4 mr-1" /> English (US)
              </button>
              <button className="hover:underline">$ USD</button>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Instagram className="h-5 w-5" />
              </a>
              {/* --- Moved Toggle Button Here --- */}
              <Button
                variant="ghost" // Changed variant for less emphasis
                size="icon" // Use icon size
                className="ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100" // Adjusted styling and margin
                onClick={() => setIsFooterVisible(!isFooterVisible)}
                title={isFooterVisible ? "Collapse footer" : "Expand footer"} // Added title for accessibility
              >
                {/* Icon */}
                {isFooterVisible ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

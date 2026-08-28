const VIEW_SEO_CONFIGS = {
  home: (param) => {
    if (param?.startsWith("category=")) {
      const cat = param.replace("category=", "");
      const formattedCat = cat.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${formattedCat} Collection | VendoraShop`,
        description: `Explore top-rated ${formattedCat} engineered for unmatched durability and performance with free shipping over $75.`,
        canonicalPath: `/#home:${param}`
      };
    }
    if (param?.startsWith("search=")) {
      const q = decodeURIComponent(param.replace("search=", ""));
      return {
        title: `Search Results for "${q}" | VendoraShop`,
        description: `Browse product results for "${q}" at VendoraShop. High-performance gear, fast shipping, and guaranteed quality.`,
        canonicalPath: `/#home:${param}`
      };
    }
    return {
      title: "VendoraShop \u2014 Precision Hardware, Audio Acoustics & Smart Gear",
      description: "Discover precision-engineered electronics, studio acoustics, ergonomic workspaces, and travel lifestyle gear with complimentary express shipping.",
      canonicalPath: "/#home"
    };
  },
  product: (param) => ({
    title: "Product Details | VendoraShop",
    description: "Explore detailed specifications, verified customer reviews, 3D interactive views, and stock availability at VendoraShop.",
    canonicalPath: param ? `/#product:${param}` : "/#home"
  }),
  cart: () => ({
    title: "Shopping Bag & Saved Items | VendoraShop",
    description: "Review your selected items, apply promotional discount codes, manage saved-for-later products, and proceed to checkout.",
    canonicalPath: "/#cart"
  }),
  checkout: () => ({
    title: "Secure Checkout | VendoraShop",
    description: "Complete your purchase with bank-grade encrypted checkout, flexible payment options, and in-store pickup availability.",
    canonicalPath: "/#checkout"
  }),
  confirmation: (param) => ({
    title: `Order Confirmation ${param ? `#${param}` : ""} | VendoraShop`,
    description: "Your order has been confirmed! View tracking milestones, download PDF tax invoices, and monitor package transit.",
    canonicalPath: param ? `/#confirmation:${param}` : "/#account:orders"
  }),
  account: (param) => {
    const tabName = param ? param.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Dashboard";
    return {
      title: `My Account (${tabName}) | VendoraShop`,
      description: "Manage your profile details, shipping addresses, live shipment tracking, loyalty points, and saved wishlists.",
      canonicalPath: param ? `/#account:${param}` : "/#account"
    };
  },
  auth: (param) => ({
    title: param === "register" ? "Create an Account | VendoraShop" : "Sign In | VendoraShop",
    description: "Sign in to access order history, personalized recommendations, VIP discount codes, and seamless checkout.",
    canonicalPath: param ? `/#auth:${param}` : "/#auth"
  }),
  admin: () => ({
    title: "Store Administration & Operations | VendoraShop",
    description: "Store operations dashboard for inventory management, real-time analytics, order dispatching, and system diagnostics.",
    canonicalPath: "/#admin"
  }),
  docs: () => ({
    title: "REST API Specs & Swagger Documentation | VendoraShop",
    description: "Comprehensive API documentation, schema references, and interactive sandbox endpoints for the Vendora e-commerce engine.",
    canonicalPath: "/#docs"
  }),
  tests: () => ({
    title: "Automated Test Runner & Diagnostics | VendoraShop",
    description: "Execute automated end-to-end integration and subsystem verification tests for the store architecture.",
    canonicalPath: "/#tests"
  })
};
function updateSeoMeta(view, param, customOverride) {
  try {
    const configGenerator = VIEW_SEO_CONFIGS[view] || VIEW_SEO_CONFIGS.home;
    const baseConfig = configGenerator(param);
    const finalConfig = { ...baseConfig, ...customOverride };
    document.title = finalConfig.title;
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };
    setMetaTag("name", "description", finalConfig.description);
    setMetaTag("property", "og:title", finalConfig.title);
    setMetaTag("property", "og:description", finalConfig.description);
    setMetaTag("property", "og:type", finalConfig.ogType || "website");
    const canonicalHref = `${window.location.origin}${finalConfig.canonicalPath || `/#${view}${param ? `:${param}` : ""}`}`;
    setMetaTag("property", "og:url", canonicalHref);
    if (finalConfig.ogImage) {
      setMetaTag("property", "og:image", finalConfig.ogImage);
    }
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalHref);
  } catch (err) {
    console.warn("[SEO] Failed to update document meta tags:", err);
  }
}
export {
  updateSeoMeta
};

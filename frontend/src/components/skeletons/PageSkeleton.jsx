import { HomePageSkeleton } from "./HomePageSkeleton";
import { ProductDetailsSkeleton } from "./ProductDetailsSkeleton";
import { CartPageSkeleton } from "./CartPageSkeleton";
import { CheckoutPageSkeleton } from "./CheckoutPageSkeleton";
import { AccountPageSkeleton } from "./AccountPageSkeleton";
import { OrderConfirmationSkeleton } from "./OrderConfirmationSkeleton";
import { AdminDashboardSkeleton } from "./AdminDashboardSkeleton";


const PageSkeleton = ({ view = "home" }) => {
  switch (view) {
    case "product":
      return <ProductDetailsSkeleton />;
    case "cart":
      return <CartPageSkeleton />;
    case "checkout":
      return <CheckoutPageSkeleton />;
    case "confirmation":
      return <OrderConfirmationSkeleton />;
    case "account":
      return <AccountPageSkeleton />;
    case "admin":
      return <AdminDashboardSkeleton />;
    case "home":
    default:
      return <HomePageSkeleton />;
  }
};
export {
  AccountPageSkeleton,
  AdminDashboardSkeleton,
  CartPageSkeleton,
  CheckoutPageSkeleton,
  HomePageSkeleton,
  OrderConfirmationSkeleton,
  PageSkeleton,
  ProductDetailsSkeleton,
};

export {ProductCardSkeleton} from "./ProductCardSkeleton";
export {ProductGridSkeleton} from "./ProductGridSkeleton";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "@/components/ui/sonner";

const App = () => {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
};
export default App;

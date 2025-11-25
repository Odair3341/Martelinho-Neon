import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated] = useState<boolean | null>(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // No auth: página simples
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-xl text-gray-600 mb-4">Not Found</p>
        <div className="space-y-2">
          <Button 
            onClick={() => navigate('/')}
            className="block mx-auto"
          >
            Ir para o início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

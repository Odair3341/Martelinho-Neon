import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-xl text-gray-600 mb-4">Not Found</p>
        <div className="space-y-2">
          {isAuthenticated ? (
            <>
              <Button 
                onClick={() => navigate('/')}
                className="block mx-auto"
              >
                Voltar ao Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                className="block mx-auto"
              >
                Fazer logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => navigate('/auth')}
                className="block mx-auto"
              >
                Fazer Login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;

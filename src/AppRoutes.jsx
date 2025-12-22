import { Routes, Route } from "react-router-dom";
import { useUser } from "@hooks";
import { privateRoutes, publicRoutes } from "./routes";

export const PublicRoutes = () => (
  <Routes>
    {publicRoutes.map(({ path, component: Component }) => (
      <Route key={path} path={path} element={<Component />} />
    ))}
  </Routes>
);

export const PrivateRoutes = () => {
  const { userRoles } = useUser();

  return (
    <Routes>
      {privateRoutes(userRoles).map(({ path, component: Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
    </Routes>
  );
};

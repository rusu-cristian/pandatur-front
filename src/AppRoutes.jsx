import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Center } from "@mantine/core";
import { useUser } from "@hooks";
import { Spin } from "@components";
import { privateRoutes, publicRoutes } from "./routes";

// Fallback для Suspense — показывается пока страница загружается
const PageLoader = () => (
  <Center h="100vh" w="100%">
    <Spin />
  </Center>
);

export const PublicRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {publicRoutes.map(({ path, component: Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
    </Routes>
  </Suspense>
);

export const PrivateRoutes = () => {
  const { userRoles } = useUser();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {privateRoutes(userRoles).map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </Suspense>
  );
};

import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useUser } from "@hooks";
import { privateRoutes, publicRoutes } from "./routes";

/**
 * Suspense fallback = null
 * 
 * Почему не спиннер:
 * 1. Lazy-компоненты загружаются очень быстро (~50-100ms)
 * 2. Спиннер на 100ms только "моргает" и раздражает пользователя
 * 3. null — страница появляется сразу, задержка незаметна
 * 
 * Если нужен лоадер для медленных сетей — используй Skeleton внутри страницы
 */

export const PublicRoutes = () => (
  <Suspense fallback={null}>
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
    <Suspense fallback={null}>
      <Routes>
        {privateRoutes(userRoles).map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </Suspense>
  );
};

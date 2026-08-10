import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * نستثني sharp من عملية bundling الخاصة بـ Webpack.
   * sharp مكتبة تحتوي على binaries/WASM حقيقية، ومحاولة
   * تضمينها (bundle) داخل Webpack بتكسر بنيتها الداخلية
   * وترجع undefined بدل الـ module الحقيقي وقت التشغيل
   * (الخطأ: "Cannot read properties of undefined (reading 'output')").
   * هذا الإعداد بيخلي Next.js يحمّلها مباشرة من node_modules
   * وقت التشغيل بدل عمل bundle ليها.
   */
  serverExternalPackages: ["sharp"],
};

export default nextConfig;

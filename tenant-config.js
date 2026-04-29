/*
  QUE HACE:
  Este archivo centraliza la configuracion publica por cliente y permite que el mismo codigo
  detecte automaticamente que cliente debe cargar segun el dominio actual.

  POR QUE SE HIZO:
  Para convertir la pagina en una base multi-tenant reutilizable, mas facil de vender y mas
  ordenada para separar clientes, dominios, bases de datos y buckets de imagenes.

  COMO MODIFICARLO:
  1. Duplica el objeto del tenant dentro de "tenants".
  2. Cambia "domains" por los dominios reales de ese cliente.
  3. Cambia "database.supabaseUrl" y "database.supabaseAnonKey" por el proyecto de ese cliente.
  4. Cambia "storage" y "commerce" si quieres separar buckets o numero de WhatsApp.

  NOTA DE SEGURIDAD:
  Aqui solo deben existir claves PUBLICAS del frontend, como el publishable/anon key de Supabase.
  NUNCA pongas aqui service_role keys, passwords reales de servidores, JWT privados o secretos.

  MIGRACION DESDE SUPABASE A OTRA BASE DE DATOS:
  - Si vas a MySQL o PostgreSQL puro, este frontend NO debe conectarse directo a la base.
  - En produccion lo correcto es poner un backend/API por tenant y cambiar "database.provider"
    a "rest-api", "mysql-api" o "postgres-api" para que el frontend hable con tu backend seguro.
  - La ventaja de esta estructura es que el dominio ya resuelve el cliente antes de inicializar datos.

  MULTIPLES DOMINIOS Y CLOUDFLARE:
  - Puedes agregar varios dominios al mismo cliente dentro de "domains".
  - Si usas Cloudflare, apunta todos esos dominios al mismo deploy y deja que este archivo
    resuelva que tenant cargar.
  - Si quieres usar imagenes optimizadas por Cloudflare, activa "useCloudflareImageResizing"
    y sirve las imagenes desde un dominio propio proxied por Cloudflare.
*/
window.APP_RUNTIME_CONFIG = {
  fallbackTenantId: "digihara-tech",
  tenants: [
    {
      id: "digihara-tech",
      clientName: "DIGIHERA TECH",
      domains: ["localhost", "127.0.0.1", "digihara-tech.local"],
      database: {
        provider: "supabase",
        /*
          QUE HACE:
          Este tenant usa un proyecto Supabase distinto. Asi cada cliente puede tener su propia DB.

          COMO CAMBIAR DE BASE DE DATOS:
          Cambia estos dos valores por el proyecto Supabase del cliente correspondiente.

          COMO CONECTAR UNA NUEVA DB:
          - Supabase: cambia URL y anon key.
          - MySQL/PostgreSQL: crea una API segura y cambia el provider para que el frontend
            ya no consulte Supabase directo.
        */
        supabaseUrl: "https://ymkfextvphwfwtqpyung.supabase.co",
        supabaseAnonKey: "sb_publishable_rMjC2VJst888Wr1ZXpoiEQ_hXjF7J7z",
        tableNames: {
          catalogos: "catalogos",
          slides: "slides",
          builder: "builder_content",
          usuarios: "usuarios",
          carrito: "carrito",
          favoritos: "favoritos",
          pedidos: "pedidos"
        }
      },
      storage: {
        /*
          QUE HACE:
          Permite separar archivos por buckets y ademas por carpetas internas de cada cliente.

          COMO SEPARAR IMAGENES POR CLIENTE:
          El codigo usa el tenantId como carpeta base, por ejemplo:
          digihara-tech/productos/archivo.webp

          COMO USAR BUCKETS O CARPETAS:
          - Si quieres una sola infra compartida, deja los mismos buckets y usa carpetas por tenant.
          - Si quieres mas aislamiento, cambia los nombres de bucket por cliente.
        */
        productBucket: "productos",
        profileBucket: "perfil",
        slideBucket: "slides"
      },
      commerce: {
        whatsappNumber: "18298483964"
      },
      security: {
        /*
          QUE HACE:
          Guarda solo hashes de passwords para no dejar contrasenas en texto plano dentro del frontend.

          POR QUE SE HIZO:
          Porque antes habia passwords reales escritas directamente en el JS.

          IMPORTANTE:
          Esto es mejor que texto plano, pero en produccion la validacion final del admin
          debe hacerse en backend. El hash en frontend solo deja la app lista para migrar.
        */
        adminUsername: "admin",
        adminPasswordHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
        wholesalePasswordHash: "73c29968b99373564ff2c7bb571fa7ca5af4ffc65ac3c36a51b95d6b572eb507",
        bossUsername: "boss@2000",
        bossPasswordHash: "8b41da4acfa6dcac42bff8d878c73ce88946896f30427b0c22a9ee94cbb7d9ba",
        bossGmail: "",
        allowClientSideAdminFallback: true
      },
      performance: {
        /*
          QUE HACE:
          Deja lista la estructura para activar optimizacion de imagenes con Cloudflare.

          COMO INTEGRARLO CON CLOUDFLARE:
          1. Pon tu dominio detras de Cloudflare.
          2. Sirve imagenes desde ese mismo dominio o desde un subdominio proxied.
          3. Activa "useCloudflareImageResizing".
          4. Ajusta "cloudflareImageBasePath" segun tu proxy o tu Worker si aplicara.
        */
        useCloudflareImageResizing: false,
        cloudflareImageBasePath: "/cdn-cgi/image",
        defaultImageQuality: 82
      }
    }
  ]
};

import { Recipe, WeeklyPlan, MonthPlan, HistoryArchiveItem, GitSyncConfig, AISettingsConfig, DayPlan } from '../types';
import { getCurrentWeekDates, formatMonthYear, formatWeekRange, getTodayISO } from '../utils/dateHelpers';

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Salmón a la Plancha con Espárragos y Quinoa',
    description: 'Filete de salmón dorado a la perfección sobre una base de quinoa ligera y espárragos trigueros asados con limón y hierbas.',
    timeMinutes: 35,
    calories: 620,
    servings: 2,
    category: 'Proteico',
    difficulty: 'Medio',
    tags: ['Alto en Proteína', 'Omega-3', 'Cena Ligera'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgTGnZnjsK70nGSrP-ENtWJxi04tJLoarv_LJrV4ue17CkKhLiyb_pFOfaDKXUQtZr6AMaC0P0jw2iOQcvBLqbmueU5nSRbZZqwLyD-PmoO7iG_xZ2Edu1B8Hwq2xV8jP5GoodCJt4jD_BDsGCYfxW0z0_wvhEtP_YkDuESpnQY2-tFVe-cGxpIxtp6LPVM9AtEGZzLtVuIok1BiltYmrAqjoPgeF1a6F_ZY_jYnp76OYV3Gb-rcSu',
    ingredients: [
      '2 filetes de salmón fresco (180g c/u)',
      '1 taza de quinoa cocida',
      '1 manojo de espárragos trigueros',
      '1 cucharada de aceite de oliva virgen extra',
      '1 limón (jugo y ralladura)',
      'Sal marina y pimienta negra recién molida',
      '1 diente de ajo picado fino'
    ],
    instructions: [
      'Lavar y cortar los extremos leñosos de los espárragos.',
      'Calentar una sartén antiadherente a fuego medio-alto con aceite de oliva.',
      'Sazonar el salmón con sal, pimienta, ajo y ralladura de limón.',
      'Cocinar el salmón 4 minutos por el lado de la piel hasta que esté crujiente, luego voltear y cocinar 3 minutos más.',
      'En la misma sartén o parrilla, asar los espárragos durante 5-6 minutos.',
      'Servir sobre una cama de quinoa caliente con un toque de zumo de limón fresco.'
    ],
    createdAt: '2023-10-01'
  },
  {
    id: 'rec-2',
    name: 'Ensalada de la Casa con Vinagreta Cítrica',
    description: 'Mezcla fresca de hojas verdes, tomates cherry, pepino crujiente, queso feta y vinagreta de miel y mostaza.',
    timeMinutes: 5,
    calories: 120,
    servings: 2,
    category: 'Rápido',
    difficulty: 'Fácil',
    tags: ['Acompañamiento', 'Vegetariano', 'Bajo en Calorías'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsdJwCKsZpeHNtSdm8txnbrxNfFmjL-K_CLN8e4OENPv8lM80ciD64H6c-64BJ2K8lusxS9LZ4LxLS4zzgJ6H1s0zLHl6ZdGx2_Vuk1Mj3uT6eWNVHpGliVe6OUt81HtuRKlLJHIOjE8HoxHd8oaq2JdNL0WXgoVLd8T6fs7pZcKg3_1K9e8CkROlB7gxLiwSkZ9kUYlYJuntMCI0SrTCFVJcE_ZrD8FqxGeoClsVe6DQVC-mJTA3t',
    ingredients: [
      '150g de brotes verdes variados (espinaca, rúcula, lechuga)',
      '10 tomates cherry cortados a la mitad',
      '1/2 pepino en rodajas finas',
      '40g de queso feta desmenuzado',
      '1 cda de aceite de oliva virgen extra',
      '1 cdta de vinagre balsámico o de manzana'
    ],
    instructions: [
      'Lavar y secar bien los brotes verdes.',
      'Disponer las hojas en una ensaladera amplia.',
      'Añadir los tomates cherry, el pepino y el queso feta.',
      'Emulsionar el aceite y el vinagre con una pizca de sal y aderezar justo antes de servir.'
    ],
    createdAt: '2023-10-02'
  },
  {
    id: 'rec-3',
    name: 'Bowl de Pollo Asado con Frijoles Negros y Maíz',
    description: 'Pechuga de pollo marinada y asada con especias tex-mex sobre hojas verdes, frijoles negros, maíz dulce y tomates cherry.',
    timeMinutes: 15,
    calories: 380,
    servings: 1,
    category: 'Proteico',
    difficulty: 'Fácil',
    tags: ['Alto en Proteína', 'Almuerzo Rápido', 'Sin Gluten'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyA3hTcHACnNUcEz7Yg-kOrPFcZitwDWRodEL2hFpCTKCK2T7SgUTYEjEp7AEyw0W3AqO85SxnHEl5GzjQoRpdF9pdf5Kd1r-S0f-CQXegaWwbBHWWybPIb6znKcuGUM5I4p9c0AGpvA8myOZAkdx7cpGcEb1Q3Qm7VwttG4gtLAgeXn4FrTVPj5ZbCACGFWSuK57sWEz1csWfEB43dOV-Xa7CnKrMOsPye-cvR-ZSrxxx2W29GGV',
    ingredients: [
      '180g de pechuga de pollo cortada en tiras',
      '1/2 taza de frijoles negros cocidos y escurridos',
      '1/3 taza de maíz tierno',
      '1 taza de mezcla de lechugas frescas',
      '6 tomates cherry cortados en mitades',
      '1/2 aguacate en láminas',
      '1 cdta de comino y pimentón dulce'
    ],
    instructions: [
      'Sazonar las tiras de pollo con comino, pimentón dulce, sal y pimienta.',
      'Cocinar en sartén con unas gotas de aceite durante 6-8 minutos hasta dorar.',
      'Montar la base de lechuga en un bowl hondo.',
      'Colocar de forma ordenada el pollo, los frijoles negros, el maíz y los tomates.',
      'Terminar con láminas de aguacate y servir.'
    ],
    createdAt: '2023-10-03'
  },
  {
    id: 'rec-4',
    name: 'Crema Rústica de Calabaza Asada con Semillas',
    description: 'Sopa cremosa de calabaza de otoño asada al horno con toque de jengibre, leche de coco y semillas crujientes.',
    timeMinutes: 25,
    calories: 290,
    servings: 3,
    category: 'Vegetariano',
    difficulty: 'Fácil',
    tags: ['Sabores de Otoño', 'Vegetariano', 'Reconfortante'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT6EdnW4sWsMk5IFVwsog_IY2H9PL_b5N1JOcnZXtEAeHkZcQm_SCnAEHdloKi1K-RoMWaW4Mi9rWJeYh7SvMye0DElUwx8MZSbF4_gEEos-qjwkL5KIOsRUzueJj5o9MjwlPqQaevMmYtl98bkOB3s_fwRokmcJQNHdoic01Nz4JLOBqPSJa8S5VpPNOVxuixiuTLPNHWDT8DJKLZwymmY3xrWNzQgW00kHI3fTVHCaJscxaR_ivL',
    ingredients: [
      '600g de calabaza pelada y en cubos',
      '1 puerro (la parte blanca)',
      '1 zanahoria mediana',
      '400ml de caldo de verduras',
      '60ml de leche de coco ligera',
      '2 cdas de pipas de calabaza tostadas',
      '1 pizca de nuez moscada y jengibre fresco rallado'
    ],
    instructions: [
      'Pochar el puerro y la zanahoria picados en una cazuela con un chorrito de aceite.',
      'Añadir los cubos de calabaza y rehogar 5 minutos.',
      'Cubrir con el caldo de verduras caliente y cocinar tapado durante 18 minutos.',
      'Triturar con batidora hasta obtener una textura suave y aterciopelada.',
      'Integrar la leche de coco y ajustar de sal y nuez moscada.',
      'Servir caliente coronando con las semillas de calabaza tostadas.'
    ],
    createdAt: '2023-10-04'
  },
  {
    id: 'rec-5',
    name: 'Ensalada Mediterránea de Garbanzos y Feta',
    description: 'Ensalada refrescante con garbanzos tiernos, tomates cherry, pepino, cebolla morada, queso feta y perejil fresco.',
    timeMinutes: 10,
    calories: 320,
    servings: 2,
    category: 'Vegetariano',
    difficulty: 'Fácil',
    tags: ['Comidas Rápidas', 'Vegetariano', 'Rico en Fibra'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj7xZ-cmJFsGcKBeMUI-ep5rtjsKQv3AlIBCZbuFEmIG-l783V5iiL47XaZZxKnC16sayll3x90LqgDd6_DkdGARJcShOpiih_fWUOfjy45ML-sVnZU9tJvmrWTy78s0xbLX8hYXlf2SGYLR7ehOdTnyhy2aJ4zFV7HU1HEAP-oxDKj6yIh47gSSXd88Kq7AFP-hAn5DHPo5kHgn0sabG0xoC_K0N0FZVGfyDFl00qHpbVr8jiU4dE',
    ingredients: [
      '400g de garbanzos cocidos lavados',
      '1 taza de tomates cherry cortados',
      '1 pepino cortado en cubitos',
      '1/4 de cebolla morada picada fina',
      '60g de queso feta en dados',
      'Hojas de perejil fresco picado',
      'Aceite de oliva virgen extra y zumo de limón'
    ],
    instructions: [
      'En un cuenco grande, mezclar los garbanzos escurridos con el pepino y los tomates.',
      'Añadir la cebolla morada y el perejil fresco.',
      'Aderezar con aceite de oliva, limón, sal y pimienta negra.',
      'Incorporar el queso feta suavemente al final para no romperlo.'
    ],
    createdAt: '2023-10-05'
  },
  {
    id: 'rec-6',
    name: 'Risotto Cremoso de Setas Silvestres y Parmesano',
    description: 'Arroz arborio cocinado lentamente en caldo aromatizado con variedad de setas salteadas, tomillo fresco y queso parmesano curado.',
    timeMinutes: 30,
    calories: 510,
    servings: 2,
    category: 'Gourmet',
    difficulty: 'Medio',
    tags: ['Vegetariano', 'Cena Gourmet', 'Italiano'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkPO7r9JqQ0fSQ9F2dAp39sjJD1V-jsj_0wk1wECyUZHvNvFAOu9v28iShdzK5Uptad0bG8i0KdqGl7H-u_WUsnabd19tqZGB2H2IH9PVTH-rsr8JFsrvsPPLdZmR4_k4NOOPBMS_Pf796ERAeryieqPCmV8eSxC91AuZJSpTndboZ2HGmK1jLQiFF0dncoV4_n6DEd1FKBpuzZdzMmQgjCu6nAddrzVe3xp4cbb9t-UIA4xbpyoty',
    ingredients: [
      '180g de arroz arborio o carnaroli',
      '250g de setas variadas (champiñones, boletus, shiitake)',
      '1/2 chalota o cebolla dulce picada',
      '60ml de vino blanco seco',
      '650ml de caldo de verduras caliente',
      '30g de mantequilla',
      '40g de queso parmesano recién rallado',
      'Tomillo fresco'
    ],
    instructions: [
      'Saltear las setas laminadas en una sartén con una cucharada de mantequilla y tomillo hasta que doren; reservar.',
      'En una cazuela, pochar la chalota en el resto de mantequilla con un chorrito de aceite.',
      'Añadir el arroz y nacarar durante 2 minutos hasta que esté translúcido.',
      'Verter el vino blanco y dejar evaporar el alcohol.',
      'Ir añadiendo el caldo caliente cucharón a cucharón sin dejar de remover durante 18 minutos.',
      'Incorporar las setas reservadas, mantecar con el queso parmesano y servir de inmediato.'
    ],
    createdAt: '2023-10-06'
  },
  {
    id: 'rec-7',
    name: 'Tostada de Aguacate con Huevo Poché',
    description: 'Pan de masa madre tostado, guacamole suave con lima y huevo poché con yema cremosa y escamas de sal marina.',
    timeMinutes: 12,
    calories: 310,
    servings: 1,
    category: 'Desayuno',
    difficulty: 'Fácil',
    tags: ['Desayuno', 'Rápido', 'Vegetariano'],
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '2 rebanadas de pan de masa madre',
      '1 aguacate maduro',
      '2 huevos camperos',
      '1 cda de zumo de lima',
      'Copos de chile rojo y semillas de sésamo',
      'Sal en escamas y aceite de oliva'
    ],
    instructions: [
      'Tostar las rebanadas de pan de masa madre.',
      'Chafar el aguacate con un tenedor añadiendo zumo de lima, sal y pimienta.',
      'Escalfar los huevos en agua hirviendo con un toque de vinagre durante 3 minutos.',
      'Untar el aguacate sobre las tostadas, colocar los huevos poché encima y terminar con copos de chile y sal en escamas.'
    ],
    createdAt: '2023-10-07'
  },
  {
    id: 'rec-8',
    name: 'Sopa Tradicional de Lentejas Caseras',
    description: 'Guiso suave de lentejas con verduras de la huerta, pimentón de la Vera y un toque de laurel.',
    timeMinutes: 40,
    calories: 390,
    servings: 4,
    category: 'Proteico',
    difficulty: 'Fácil',
    tags: ['Tradicional', 'Rico en Hierro', 'Proteico'],
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '300g de lentejas pardinas',
      '1 zanahoria en rodajas',
      '1 patata pelada y chascada',
      '1 pimiento verde',
      '1 tomate maduro rallado',
      '1 hoja de laurel',
      '1 cdta de pimentón dulce'
    ],
    instructions: [
      'Poner todos los ingredientes en una cazuela cubiertos con agua fría.',
      'Llevar a ebullición y cocinar a fuego lento durante 35-40 minutos.',
      'Retirar el pimiento y triturar con un poco de caldo si se desea espesar.',
      'Servir caliente con un hilo de aceite de oliva.'
    ],
    createdAt: '2023-10-08'
  },
  {
    id: 'rec-9',
    name: 'Salteado Oriental de Tofu y Verduras al Wok',
    description: 'Dados de tofu crujiente salteados con brócoli, pimientos de colores, anacardos y salsa de soja y sésamo.',
    timeMinutes: 20,
    calories: 340,
    servings: 2,
    category: 'Vegetariano',
    difficulty: 'Fácil',
    tags: ['Vegano', 'Rápido', 'Bajo en Grasa'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '250g de tofu firme prensado',
      '1 taza de ramilletes de brócoli',
      '1 pimiento rojo en tiras',
      '2 cdas de salsa de soja baja en sal',
      '1 cda de aceite de sésamo',
      '2 cdas de anacardos tostados',
      'Semillas de sésamo blanco y negro'
    ],
    instructions: [
      'Cortar el tofu en dados y dorar en un wok caliente con aceite de sésamo.',
      'Añadir las verduras en tiras y saltear a fuego vivo 5 minutos manteniendo el punto crujiente.',
      'Verter la salsa de soja y mezclar bien.',
      'Espolvorear con anacardos y semillas de sésamo antes de servir.'
    ],
    createdAt: '2023-10-09'
  },
  {
    id: 'rec-10',
    name: 'Filete de Ternera con Espárragos a la Brasa',
    description: 'Corte magro de ternera sellado al punto, servido con espárragos verdes a la parrilla y mantequilla de hierbas.',
    timeMinutes: 20,
    calories: 480,
    servings: 1,
    category: 'Proteico',
    difficulty: 'Fácil',
    tags: ['Alto en Proteína', 'Keto', 'Cena Rápida'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '200g de solomillo o lomo de ternera',
      '8 espárragos verdes',
      '1 cdta de mantequilla de romero',
      'Sal gruesa y pimienta recién molida',
      '1 cda de aceite de oliva'
    ],
    instructions: [
      'Atemperar la carne 15 minutos antes de cocinar.',
      'Calentar la plancha hasta que humee ligeramente.',
      'Cocinar el filete 2-3 minutos por lado según el punto deseado.',
      'Asar los espárragos en la misma plancha.',
      'Dejar reposar la carne 2 minutos con la mantequilla de hierbas encima.'
    ],
    createdAt: '2023-10-10'
  }
];

const currentWeek = getCurrentWeekDates();
const weekStart = currentWeek[0].date;
const weekEnd = currentWeek[6].date;
const weekTitle = `Semana del ${formatWeekRange(weekStart, weekEnd)}`;

export const INITIAL_WEEKLY_PLAN: WeeklyPlan = {
  id: 'week-current',
  startDate: weekStart,
  endDate: weekEnd,
  title: weekTitle,
  tags: ['Menú Semanal', 'Equilibrado'],
  days: {
    [currentWeek[0].date]: {
      date: currentWeek[0].date,
      dayName: currentWeek[0].dayName,
      dayNumber: currentWeek[0].dayNumber,
      breakfast: [
        {
          id: 'm-1',
          recipeId: 'rec-7',
          name: 'Tostada de Aguacate con Huevo',
          timeMinutes: 12,
          calories: 310,
          imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80'
        }
      ],
      lunch: [
        {
          id: 'm-2',
          recipeId: 'rec-3',
          name: 'Bowl de Pollo Asado con Frijoles Negros y Maíz',
          timeMinutes: 15,
          calories: 380,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyA3hTcHACnNUcEz7Yg-kOrPFcZitwDWRodEL2hFpCTKCK2T7SgUTYEjEp7AEyw0W3AqO85SxnHEl5GzjQoRpdF9pdf5Kd1r-S0f-CQXegaWwbBHWWybPIb6znKcuGUM5I4p9c0AGpvA8myOZAkdx7cpGcEb1Q3Qm7VwttG4gtLAgeXn4FrTVPj5ZbCACGFWSuK57sWEz1csWfEB43dOV-Xa7CnKrMOsPye-cvR-ZSrxxx2W29GGV'
        }
      ],
      dinner: [
        {
          id: 'm-3',
          recipeId: 'rec-1',
          name: 'Salmón a la Plancha con Espárragos',
          timeMinutes: 35,
          calories: 620,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgTGnZnjsK70nGSrP-ENtWJxi04tJLoarv_LJrV4ue17CkKhLiyb_pFOfaDKXUQtZr6AMaC0P0jw2iOQcvBLqbmueU5nSRbZZqwLyD-PmoO7iG_xZ2Edu1B8Hwq2xV8jP5GoodCJt4jD_BDsGCYfxW0z0_wvhEtP_YkDuESpnQY2-tFVe-cGxpIxtp6LPVM9AtEGZzLtVuIok1BiltYmrAqjoPgeF1a6F_ZY_jYnp76OYV3Gb-rcSu'
        }
      ]
    },
    [currentWeek[1].date]: {
      date: currentWeek[1].date,
      dayName: currentWeek[1].dayName,
      dayNumber: currentWeek[1].dayNumber,
      breakfast: [
        {
          id: 'm-4',
          name: 'Batido de Proteína y Frutos Rojos',
          timeMinutes: 5,
          calories: 260,
          imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80'
        }
      ],
      lunch: [
        {
          id: 'm-5',
          recipeId: 'rec-5',
          name: 'Ensalada Mediterránea de Garbanzos',
          timeMinutes: 10,
          calories: 320,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj7xZ-cmJFsGcKBeMUI-ep5rtjsKQv3AlIBCZbuFEmIG-l783V5iiL47XaZZxKnC16sayll3x90LqgDd6_DkdGARJcShOpiih_fWUOfjy45ML-sVnZU9tJvmrWTy78s0xbLX8hYXlf2SGYLR7ehOdTnyhy2aJ4zFV7HU1HEAP-oxDKj6yIh47gSSXd88Kq7AFP-hAn5DHPo5kHgn0sabG0xoC_K0N0FZVGfyDFl00qHpbVr8jiU4dE'
        }
      ],
      dinner: [
        {
          id: 'm-6',
          recipeId: 'rec-4',
          name: 'Crema Rústica de Calabaza Asada',
          timeMinutes: 25,
          calories: 290,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT6EdnW4sWsMk5IFVwsog_IY2H9PL_b5N1JOcnZXtEAeHkZcQm_SCnAEHdloKi1K-RoMWaW4Mi9rWJeYh7SvMye0DElUwx8MZSbF4_gEEos-qjwkL5KIOsRUzueJj5o9MjwlPqQaevMmYtl98bkOB3s_fwRokmcJQNHdoic01Nz4JLOBqPSJa8S5VpPNOVxuixiuTLPNHWDT8DJKLZwymmY3xrWNzQgW00kHI3fTVHCaJscxaR_ivL'
        }
      ]
    },
    [currentWeek[2].date]: {
      date: currentWeek[2].date,
      dayName: currentWeek[2].dayName,
      dayNumber: currentWeek[2].dayNumber,
      breakfast: [],
      lunch: [
        {
          id: 'm-7',
          recipeId: 'rec-8',
          name: 'Sopa de Lentejas Caseras',
          timeMinutes: 40,
          calories: 390,
          imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80'
        }
      ],
      dinner: [
        {
          id: 'm-8',
          recipeId: 'rec-9',
          name: 'Salteado de Tofu y Verduras',
          timeMinutes: 20,
          calories: 340,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
        }
      ]
    },
    [currentWeek[3].date]: {
      date: currentWeek[3].date,
      dayName: currentWeek[3].dayName,
      dayNumber: currentWeek[3].dayNumber,
      breakfast: [],
      lunch: [
        {
          id: 'm-9',
          recipeId: 'rec-6',
          name: 'Risotto de Setas Silvestres',
          timeMinutes: 30,
          calories: 510,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkPO7r9JqQ0fSQ9F2dAp39sjJD1V-jsj_0wk1wECyUZHvNvFAOu9v28iShdzK5Uptad0bG8i0KdqGl7H-u_WUsnabd19tqZGB2H2IH9PVTH-rsr8JFsrvsPPLdZmR4_k4NOOPBMS_Pf796ERAeryieqPCmV8eSxC91AuZJSpTndboZ2HGmK1jLQiFF0dncoV4_n6DEd1FKBpuzZdzMmQgjCu6nAddrzVe3xp4cbb9t-UIA4xbpyoty'
        }
      ],
      dinner: []
    },
    [currentWeek[4].date]: {
      date: currentWeek[4].date,
      dayName: currentWeek[4].dayName,
      dayNumber: currentWeek[4].dayNumber,
      breakfast: [],
      lunch: [],
      dinner: [
        {
          id: 'm-10',
          recipeId: 'rec-10',
          name: 'Pechuga a la Plancha con Espárragos',
          timeMinutes: 20,
          calories: 440,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoXlejA7N7pLhKK0E9hP6DXJ8u8XBkifeHgL7Ky7UMPrhz3ZihN0l9ucXznoy9SID4dBT5rq8g0sPQikY3vLPRDWWurWA_SspytboI5xFHv494y2cSm_6YJWECf28c7xS_yG2Ga-1lGJo3AgK1XlD0FajGtMk_H6KGZInsRQaho3Ui6QttB6MBekwfk-ZGCjNk1of2Q-Kt0T_IK6oajBqq4d5w0vk1Vf5AbXAv56q0L4yre3kXJiSH'
        }
      ]
    },
    [currentWeek[5].date]: {
      date: currentWeek[5].date,
      dayName: currentWeek[5].dayName,
      dayNumber: currentWeek[5].dayNumber,
      breakfast: [],
      lunch: [],
      dinner: []
    },
    [currentWeek[6].date]: {
      date: currentWeek[6].date,
      dayName: currentWeek[6].dayName,
      dayNumber: currentWeek[6].dayNumber,
      breakfast: [],
      lunch: [],
      dinner: []
    }
  }
};

const now = new Date();
const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const currentMonthName = formatMonthYear(now);

// Sembrar los días de la semana actual en el plan mensual
const initialMonthDays: Record<string, DayPlan> = {};
currentWeek.forEach((cw) => {
  const weeklyDay = INITIAL_WEEKLY_PLAN.days[cw.date];
  if (weeklyDay) {
    initialMonthDays[cw.date] = { ...weeklyDay };
  }
});

export const INITIAL_MONTH_PLAN: MonthPlan = {
  monthKey: currentMonthKey,
  monthName: currentMonthName,
  plannedMealsCount: Object.values(initialMonthDays).reduce((acc, d) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0), 0),
  totalMealSlots: 60,
  avgDailyKcal: 2050,
  days: initialMonthDays
};

export const INITIAL_HISTORY: HistoryArchiveItem[] = [
  {
    id: 'hist-1',
    title: weekTitle,
    startDate: weekStart,
    endDate: weekEnd,
    tags: ['Semana en Curso', 'Equilibrado'],
    recipeCount: 8,
    totalDays: 7,
    previewRecipes: [
      {
        name: 'Salmón a la Plancha',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgTGnZnjsK70nGSrP-ENtWJxi04tJLoarv_LJrV4ue17CkKhLiyb_pFOfaDKXUQtZr6AMaC0P0jw2iOQcvBLqbmueU5nSRbZZqwLyD-PmoO7iG_xZ2Edu1B8Hwq2xV8jP5GoodCJt4jD_BDsGCYfxW0z0_wvhEtP_YkDuESpnQY2-tFVe-cGxpIxtp6LPVM9AtEGZzLtVuIok1BiltYmrAqjoPgeF1a6F_ZY_jYnp76OYV3Gb-rcSu'
      },
      {
        name: 'Bowl de Pollo Asado',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyA3hTcHACnNUcEz7Yg-kOrPFcZitwDWRodEL2hFpCTKCK2T7SgUTYEjEp7AEyw0W3AqO85SxnHEl5GzjQoRpdF9pdf5Kd1r-S0f-CQXegaWwbBHWWybPIb6znKcuGUM5I4p9c0AGpvA8myOZAkdx7cpGcEb1Q3Qm7VwttG4gtLAgeXn4FrTVPj5ZbCACGFWSuK57sWEz1csWfEB43dOV-Xa7CnKrMOsPye-cvR-ZSrxxx2W29GGV'
      }
    ],
    createdAt: getTodayISO(),
    planData: INITIAL_WEEKLY_PLAN
  }
];

export const INITIAL_GIT_CONFIG: GitSyncConfig = {
  repoUrl: '',
  branch: 'main',
  token: '',
  isConnected: false,
  lastSyncedAt: null,
  statusText: 'No sincronizado'
};

export const INITIAL_AI_SETTINGS: AISettingsConfig = {
  hasApiKey: false,
  systemInstruction: 'Extraer solo los datos reales, calcular calorías estimadas precisas y formatear ingredientes con medidas exactas en español.',
  preferredDiet: 'Equilibrada con alto contenido proteico',
  targetDailyCalories: 2200
};

import { APIGatewayProxyEventV2 } from "aws-lambda";

type HeaderKeyValue = {
  key: string;
  value: any;
};

type HeaderObject = Array<HeaderKeyValue>;

type CorsOrigin =
  | string
  | boolean
  | RegExp
  | Array<RegExp | string>
  | Function
  | undefined;

export interface CorsOptions {
  origin?: CorsOrigin;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  maxAge?: number;
  credentials?: boolean;
}

const defaults = {
  origin: "*",
  methods: "GET,POST,PUT,DELETE,HEAD,PATCH",
  allowedHeaders:
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
};

function isString(s: any) {
  return typeof s === "string" || s instanceof String;
}

const isOriginAllowed = (
  origin: string,
  allowedOrigin: CorsOrigin
): boolean => {
  if (Array.isArray(allowedOrigin)) {
    for (var i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) {
        return true;
      }
    }
    return false;
  } else if (isString(allowedOrigin)) {
    return origin === allowedOrigin;
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  } else {
    return !!allowedOrigin;
  }
};

const configureOrigin = (
  options: CorsOptions,
  event: APIGatewayProxyEventV2
): HeaderObject => {
  const { origin } = options;
  const headers: HeaderObject = [];

  if (origin === true || origin === "*") {
    headers.push({
      key: "Access-Control-Allow-Origin",
      value: "*",
    });
  } else if (isString(origin)) {
    headers.push(
      {
        key: "Access-Control-Allow-Origin",
        value: origin,
      },
      {
        key: "Vary",
        value: "Origin",
      }
    );
  } else if (typeof origin === "function") {
    headers.push(
      {
        key: "Access-Control-Allow-Origin",
        value: origin(event),
      },
      {
        key: "Vary",
        value: "Origin",
      }
    );
  } else {
    const requestOrigin: string = event.headers.origin;
    const isAllowed: boolean = isOriginAllowed(requestOrigin, origin);

    headers.push(
      {
        key: "Access-Control-Allow-Origin",
        value: isAllowed ? requestOrigin : false,
      },
      {
        key: "Vary",
        value: "Origin",
      }
    );
  }

  return headers;
};

const configureMethods = (options: CorsOptions): HeaderObject => {
  const { methods } = options;

  return [
    {
      key: "Access-Control-Allow-Methods",
      value: Array.isArray(methods) ? methods.join(",") : methods,
    },
  ];
};

const configureAllowedHeaders = (
  options: CorsOptions,
  event: APIGatewayProxyEventV2
): HeaderObject => {
  let { allowedHeaders } = options;
  const headers = [];

  if (!allowedHeaders) {
    allowedHeaders = event.headers["Access-Control-Request-Headers"];
    headers.push({
      key: "Vary",
      value: "Access-Control-Request-Headers",
    });
  } else if (Array.isArray(allowedHeaders)) {
    allowedHeaders = allowedHeaders.join(",");
  }

  if (allowedHeaders && allowedHeaders.length) {
    headers.push({
      key: "Access-Control-Allow-Headers",
      value: allowedHeaders,
    });
  }

  return headers;
};

const configureExposedHeaders = (options: CorsOptions): HeaderObject => {
  let { exposedHeaders } = options;

  if (!exposedHeaders) {
    return [];
  } else if (Array.isArray(exposedHeaders)) {
    exposedHeaders = exposedHeaders.join(",");
  }
  if (exposedHeaders) {
    return [
      {
        key: "Access-Control-Expose-Headers",
        value: exposedHeaders,
      },
    ];
  }
  return [];
};

const configureAllowMaxAge = (options: CorsOptions): HeaderObject => {
  const { maxAge } = options;

  return !maxAge
    ? []
    : [
        {
          key: "Access-Control-Max-Age",
          value: `${maxAge}`,
        },
      ];
};

const configureCredentials = (options: CorsOptions): HeaderObject => {
  const { credentials } = options;

  return credentials === true
    ? [
        {
          key: "Access-Control-Allow-Credentials",
          value: "true",
        },
      ]
    : [];
};

const generateHeaders = (headersArray: Array<HeaderObject>) => {
  const vary: string[] = [];
  const headers: any = {};

  headersArray.forEach((header: HeaderObject) => {
    header.forEach((h: HeaderKeyValue) => {
      if (h.key === "Vary" && h.value) {
        vary.push(h.value);
      } else {
        headers[h.key] = h.value;
      }
    });
  });

  return {
    ...headers,
    ...(vary.length && { Vary: vary.join(",") }),
  };
};

export const addCorsHeaders = (
  options: CorsOptions | boolean,
  event: APIGatewayProxyEventV2
) => {
  if (options === false) {
    return {};
  }

  const corsOptions = Object.assign(
    {},
    defaults,
    typeof options === "object" ? options : {}
  );

  return generateHeaders([
    configureOrigin(corsOptions, event),
    configureExposedHeaders(corsOptions),
    configureCredentials(corsOptions),
    configureMethods(corsOptions),
    configureAllowedHeaders(corsOptions, event),
    configureAllowMaxAge(corsOptions),
  ]);
};

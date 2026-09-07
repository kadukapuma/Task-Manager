<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The frontend (Vite dev server) runs on a different origin than the API,
    | so CORS must be enabled for the api/* routes. No cookies are used for
    | auth (the session token travels in the Authorization header), so
    | supports_credentials stays false.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];

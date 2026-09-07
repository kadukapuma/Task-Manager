<?php

return [

    /*
    |--------------------------------------------------------------------------
    | JWT Secret
    |--------------------------------------------------------------------------
    |
    | Used to sign and verify session tokens issued at login. Falls back to
    | the app key so a dedicated secret isn't required in every environment.
    |
    */

    'secret' => env('JWT_SECRET', env('APP_KEY')),

    /*
    |--------------------------------------------------------------------------
    | Token Lifetime
    |--------------------------------------------------------------------------
    |
    | Number of minutes a login session token stays valid for.
    |
    */

    'ttl' => (int) env('JWT_TTL', 480),

];

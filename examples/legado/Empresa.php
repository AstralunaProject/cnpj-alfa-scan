<?php

Schema::create('empresas', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('cnpj')->unique();
});

function limpar_cnpj(string $cnpj): string
{
    return preg_replace('/[^0-9]/', '', $cnpj);
}

function cnpj_valido(string $cnpj): bool
{
    return ctype_digit($cnpj) && strlen($cnpj) === 14;
}

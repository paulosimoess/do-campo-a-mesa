<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registos_auditoria', function (Blueprint $table) {
            $table->id();

            $table->string('administrador_id');
            $table->string('administrador_nome');

            $table->string('acao');
            $table->string('entidade');
            $table->string('entidade_id');

            $table->string('resultado');

            $table->timestamps();

            $table->index('administrador_id');
            $table->index('acao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registos_auditoria');
    }
};

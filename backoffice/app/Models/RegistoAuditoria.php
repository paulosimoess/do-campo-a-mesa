<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistoAuditoria extends Model
{
    protected $table = 'registos_auditoria';

    protected $fillable = [
        'administrador_id',
        'administrador_nome',
        'acao',
        'entidade',
        'entidade_id',
        'resultado'
    ];
}

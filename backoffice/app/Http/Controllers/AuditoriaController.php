<?php

namespace App\Http\Controllers;

use App\Models\RegistoAuditoria;
use Illuminate\View\View;

class AuditoriaController extends Controller
{
    public function index(): View
    {
        $registos = RegistoAuditoria::query()
            ->orderByDesc('created_at')
            ->paginate(10);

        return view('auditoria.index', [
            'registos' => $registos
        ]);
    }
}

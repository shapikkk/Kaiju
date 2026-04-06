<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BlockController extends Controller
{
    public function store(Request $request, int $userId): JsonResponse
    {
        $target = User::findOrFail($userId);

        if ($target->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot block yourself.'], 422);
        }

        DB::table('blocked_users')->insertOrIgnore([
            'user_id'         => $request->user()->id,
            'blocked_user_id' => $target->id,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        return response()->json(['blocked' => true]);
    }

    public function destroy(Request $request, int $userId): JsonResponse
    {
        DB::table('blocked_users')
            ->where('user_id', $request->user()->id)
            ->where('blocked_user_id', $userId)
            ->delete();

        return response()->json(['blocked' => false]);
    }

    public function check(Request $request, int $userId): JsonResponse
    {
        $blocked = DB::table('blocked_users')
            ->where('user_id', $request->user()->id)
            ->where('blocked_user_id', $userId)
            ->exists();

        return response()->json(['blocked' => $blocked]);
    }
}

<?php

namespace App\Actions\Workspace;

use App\DTOs\CreateWorkspaceDTO;
use App\Enums\WorkspaceRole;
use App\Models\Channel;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

final class CreateWorkspaceAction
{
    public function execute(CreateWorkspaceDTO $dto): Workspace
    {
        return DB::transaction(function () use ($dto) {
            $workspace = Workspace::create([
                'name' => $dto->name,
                'slug' => $dto->slug,
                'description' => $dto->description,
                'owner_id' => $dto->ownerId,
            ]);

            $workspace->members()->attach($dto->ownerId, [
                'role' => WorkspaceRole::Owner->value,
            ]);

            Channel::create([
                'workspace_id' => $workspace->id,
                'name'         => 'general',
                'description'  => 'General discussion for the whole team.',
            ]);

            return $workspace->load('owner', 'members', 'channels');
        });
    }
}

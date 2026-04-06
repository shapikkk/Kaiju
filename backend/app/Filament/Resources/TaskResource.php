<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TaskResource\Pages;
use App\Models\Task;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TaskResource extends Resource
{
    protected static ?string $model = Task::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-check';

    protected static ?string $navigationGroup = 'Project';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Task Details')->schema([
                Forms\Components\TextInput::make('title')
                    ->required()
                    ->maxLength(255)
                    ->columnSpanFull(),

                Forms\Components\Textarea::make('description')
                    ->maxLength(5000)
                    ->rows(4)
                    ->columnSpanFull(),

                Forms\Components\Select::make('board_id')
                    ->relationship('board', 'name')
                    ->searchable()
                    ->required(),

                Forms\Components\Select::make('column_id')
                    ->relationship('column', 'name')
                    ->searchable()
                    ->required(),

                Forms\Components\Select::make('priority')
                    ->options([
                        'lowest' => '⏬ Lowest',
                        'low' => '🔽 Low',
                        'medium' => '➡️ Medium',
                        'high' => '🔼 High',
                        'highest' => '⏫ Highest',
                    ])
                    ->default('medium')
                    ->required(),

                Forms\Components\Select::make('creator_id')
                    ->relationship('creator', 'name')
                    ->searchable()
                    ->required()
                    ->label('Creator'),

                Forms\Components\Select::make('assignee_id')
                    ->relationship('assignee', 'name')
                    ->searchable()
                    ->nullable()
                    ->label('Assignee'),

                Forms\Components\Select::make('sprint_id')
                    ->relationship('sprint', 'name')
                    ->searchable()
                    ->nullable(),

                Forms\Components\Select::make('epic_id')
                    ->relationship('epic', 'name')
                    ->searchable()
                    ->nullable(),

                Forms\Components\DatePicker::make('due_date')
                    ->nullable(),

                Forms\Components\TextInput::make('estimated_hours')
                    ->numeric()
                    ->minValue(0)
                    ->nullable(),

                Forms\Components\TextInput::make('position')
                    ->numeric()
                    ->default(0),

                Forms\Components\TextInput::make('task_number')
                    ->numeric()
                    ->disabled()
                    ->label('Task #'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('task_number')
                    ->label('#')
                    ->sortable(),

                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->limit(50),

                Tables\Columns\TextColumn::make('board.name')
                    ->sortable(),

                Tables\Columns\TextColumn::make('column.name')
                    ->sortable()
                    ->badge(),

                Tables\Columns\TextColumn::make('priority')
                    ->badge()
                    ->color(fn(mixed $state): string => match (is_object($state) ? $state->value : $state) {
                        'highest' => 'danger',
                        'high' => 'warning',
                        'medium' => 'primary',
                        'low' => 'info',
                        'lowest' => 'gray',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('assignee.name')
                    ->label('Assignee')
                    ->default('—'),

                Tables\Columns\TextColumn::make('due_date')
                    ->date()
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('board')
                    ->relationship('board', 'name'),

                Tables\Filters\SelectFilter::make('priority')
                    ->options([
                        'lowest' => 'Lowest',
                        'low' => 'Low',
                        'medium' => 'Medium',
                        'high' => 'High',
                        'highest' => 'Highest',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTasks::route('/'),
            'create' => Pages\CreateTask::route('/create'),
            'edit' => Pages\EditTask::route('/{record}/edit'),
        ];
    }
}

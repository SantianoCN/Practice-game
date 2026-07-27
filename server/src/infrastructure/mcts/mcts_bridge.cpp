#include <napi.h>
#include <vector>
#include <cmath>
#include <limits>
#include <iostream>
#include <string>

#include "game_state.h"
#include "room_map.h"
#include "mcts.h"
#include "action_types.h"
#include "game_engine.h"
#include "action_table.h"
#include "action_module.h"

using namespace Napi;

RoomMap g_currentMap;

GameState ConvertToGameState(const Napi::Object &obj)
{
    GameState state;
    
    g_currentMap.obstacles.clear();
    
    state.npc_hp = obj.Get("npc_hp").As<Number>().Int32Value();
    state.npc_x = obj.Get("npc_x").As<Number>().Int32Value();
    state.npc_y = obj.Get("npc_y").As<Number>().Int32Value();
    state.npc_vx = obj.Get("npc_vx").As<Number>().Int32Value();
    state.npc_vy = obj.Get("npc_vy").As<Number>().Int32Value();
    state.npc_damage = obj.Get("npc_damage").As<Number>().Int32Value();
    state.npc_speed = obj.Get("npc_speed").As<Number>().Int32Value();
    state.npc_range = obj.Get("npc_range").As<Number>().Int32Value();

    Napi::Array players = obj.Get("players").As<Array>();
    state.players_count = std::min((int)players.Length(), GameState::MAX_PLAYERS_COUNT);

    for (int i = 0; i < state.players_count; i++)
    {
        Napi::Object p = players.Get(i).As<Object>();
        state.players[i].hp = p.Get("hp").As<Number>().Int32Value();
        state.players[i].x = p.Get("x").As<Number>().Int32Value();
        state.players[i].y = p.Get("y").As<Number>().Int32Value();
        state.players[i].vx = p.Get("vx").As<Number>().Int32Value();
        state.players[i].vy = p.Get("vy").As<Number>().Int32Value();
        state.players[i].damage = p.Get("damage").As<Number>().Int32Value();
        state.players[i].range = p.Get("range").As<Number>().Int32Value();
        state.players[i].speed = p.Get("speed").As<Number>().Int32Value();
    }

    Napi::Array obstacles = obj.Get("obstacles").As<Array>();
    for (int i = 0; i < (int)obstacles.Length(); i++)
    {
        Napi::Object o = obstacles.Get(i).As<Object>();
        Obstacle ob;
        ob.x = o.Get("x").As<Number>().Int32Value();
        ob.y = o.Get("y").As<Number>().Int32Value();
        ob.width = o.Get("width").As<Number>().Int32Value();
        ob.height = o.Get("height").As<Number>().Int32Value();
        g_currentMap.obstacles.push_back(ob);
    }

    return state;
}

std::string GetActionName(ActionType action)
{
    return action_names[static_cast<int>(action)];
}

class MCTSAddon : public Napi::ObjectWrap<MCTSAddon>
{
private:
    MCTS *mcts;
    GameEngine *engine;
    RoomMap map;

public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports)
    {
        Napi::Function func = DefineClass(env, "MCTS", {
            InstanceMethod("findBestAction", &MCTSAddon::FindBestAction),
            InstanceMethod("getStats", &MCTSAddon::GetStats),
        });

        exports.Set("MCTS", func);
        return exports;
    }

    MCTSAddon(const Napi::CallbackInfo &info) : Napi::ObjectWrap<MCTSAddon>(info)
    {
        Napi::Env env = info.Env();

        if (info.Length() < 4)
        {
            Napi::TypeError::New(env, "Expected 4 arguments: mapWidth, mapHeight, iterations, cValue")
                .ThrowAsJavaScriptException();
            return;
        }

        int mapWidth = info[0].As<Number>().Int32Value();
        int mapHeight = info[1].As<Number>().Int32Value();
        int iterations = info[2].As<Number>().Int32Value();
        double cValue = info[3].As<Number>().DoubleValue();

        map.width = mapWidth;
        map.height = mapHeight;

        engine = new GameEngine(map);
        mcts = new MCTS(*engine, iterations, cValue);
    }

    ~MCTSAddon()
    {
        delete mcts;
        delete engine;
    }

    Napi::Value FindBestAction(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();

        if (info.Length() < 1)
        {
            Napi::TypeError::New(env, "Expected state object")
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        GameState state = ConvertToGameState(info[0].As<Napi::Object>());
        
        engine->setObstacles(g_currentMap.obstacles);

        ActionType action = mcts->find_best_action(state);

        Napi::Object result = Napi::Object::New(env);
        result.Set("action", Napi::Number::New(env, static_cast<int>(action)));
        result.Set("actionName", Napi::String::New(env, GetActionName(action)));

        return result;
    }

    Napi::Value GetStats(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        
        Napi::Array stats = Napi::Array::New(env);
        
        return stats;
    }
};

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    return MCTSAddon::Init(env, exports);
}

NODE_API_MODULE(mcts, Init)
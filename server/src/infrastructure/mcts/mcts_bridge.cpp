#include <napi.h>
#include <vector>
#include <cmath>
#include <limits>


#include "game_state.h"
#include "room_map.h"
#include "mcts.h"
#include "action_types.h"

using namespace Napi;

GameState ConvertToGameState(const Napi::Object& obj) {
    GameState state;
    
    state.npc_hp = obj.Get("npc_hp").As<Number>().Int32Value();
    state.npc_x = obj.Get("npc_x").As<Number>().Int32Value();
    state.npc_y = obj.Get("npc_y").As<Number>().Int32Value();
    state.npc_vx = obj.Get("npc_vx").As<Number>().Int32Value();
    state.npc_vy = obj.Get("npc_vy").As<Number>().Int32Value();
    state.npc_damage = obj.Get("npc_damage").As<Number>().Int32Value();
    state.npc_speed = obj.Get("npc_speed").As<Number>().Int32Value();
    state.npc_range = obj.Get("npc_range").As<Number>().Int32Value();
    
    
    Napi::Array players = obj.Get("players").As<Array>();
    state.players_count = std::min((int)players.Length(), 4);
    
    for (int i = 0; i < state.players_count; i++) {
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
    
    return state;
}


std::string GetActionName(ActionType action) {
    switch(action) {
        case ActionType::MoveUp: return "Вверх";
        case ActionType::MoveDown: return "Вниз";
        case ActionType::MoveLeft: return "Влево";
        case ActionType::MoveRight: return "Вправо";
        case ActionType::Wait: return "Ждать";
        case ActionType::Approach: return "Сближение";
        case ActionType::Retreat: return "Отступление";
        case ActionType::StrafeLeft: return "Стрейф влево";
        case ActionType::StrafeRight: return "Стрейф вправо";
        case ActionType::Attack: return "Атака";
        default: return "Неизвестно";
    }
}



class MCTSAddon : public Napi::ObjectWrap<MCTSAddon> {
private:
    MCTS* mcts;
    
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "MCTS", {
            InstanceMethod("findBestAction", &MCTSAddon::FindBestAction),
        });
        
        exports.Set("MCTS", func);
        return exports;
    }
    
    
    MCTSAddon(const Napi::CallbackInfo& info) : Napi::ObjectWrap<MCTSAddon>(info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 4) {
            Napi::TypeError::New(env, "Expected 4 arguments: mapWidth, mapHeight, iterations, cValue")
                .ThrowAsJavaScriptException();
            return;
        }
        
        int mapWidth = info[0].As<Number>().Int32Value();
        int mapHeight = info[1].As<Number>().Int32Value();
        int iterations = info[2].As<Number>().Int32Value();
        double cValue = info[3].As<Number>().DoubleValue();
        
        
        RoomMap map;
        map.width = mapWidth;
        map.height = mapHeight;
        
        
        GameEngine* engine = new GameEngine(map);
        mcts = new MCTS(*engine, iterations, cValue);
    }
    
    
    ~MCTSAddon() {
        delete mcts;
    }
    
    
    Napi::Value FindBestAction(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected state object")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        
        
        GameState state = ConvertToGameState(info[0].As<Napi::Object>());
        
        
        ActionType action = mcts->find_best_action(state);
        
        
        Napi::Object result = Napi::Object::New(env);
        result.Set("action", static_cast<int>(action));
        result.Set("actionName", GetActionName(action));
        
        return result;
    }
};



Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return MCTSAddon::Init(env, exports);
}

NODE_API_MODULE(mcts, Init)
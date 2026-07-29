#pragma once

// ����������� ����������������� ��������
enum ActionType {
    Engage, // ��������� � ����� ��� LOS
    Kite,   // ������� ��������� � �������� ��� LOS
    //Flank,  // ������/����� � ���
    Retreat,// ���������, ������
    Wait,   // ������� �� ������ ��� ��������
    PlayerAttack,   // ����� �������
    PlayerMoveAway, // ����� �������
    PlayerMoveCloser,   // ����� ������������
    None,   // ��� ��������
    COUNT   // ���-�� ��������
};

inline const char* action_names[] = {
    "Engage",
    "Kite",
    //"Flank",
    "Retreat",
    "Wait",
    "PlayerAttack", 
    "PlayeMoveAway",
    "PlayerMoveCloser",
    "None"
};
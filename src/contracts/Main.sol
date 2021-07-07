pragma solidity >=0.4.22 <0.9.0;

contract Main {
  function _fallback() payable: # default function
    revert with 0x8c379a000000000000000000000000000000000000000000000000000000000, 'BalanceChecker does not accept payments'

  function unknownd187e84d(addr _param1, addr _param2): # not payable
    if ext_code.size(_param2) <= 0:
        return 0
    call _param2.0xbf92857c with:
        gas gas_remaining wei
        args _param1
    if not ext_call.success:
        return 0
    require ext_code.size(_param2)
    call _param2.0xbf92857c with:
        gas gas_remaining wei
        args _param1
    if not ext_call.success:
        revert with ext_call.return_data[0 len return_data.size]
    require return_data.size >= 192
    return ext_call.return_data[160]

  function unknowneeca59a2(): # not payable
    if ('cd', 4).length:
        mem[128 len 32 * ('cd', 4).length] = code.data * ('cd', 4).length]
    idx = 0
    while idx < ('cd', 4).length:
        if addr(cd):
            require idx < ('cd', 4).length
            if ext_code.size(addr(cd)) <= 0:
                require idx < ('cd', 4).length
                mem[(32 * idx) + 128] = 0
            else:
                mem[(32 * ('cd', 4).length) + 128] = 0xbf92857c00000000000000000000000000000000000000000000000000000000
                mem[(32 * ('cd', 4).length) + 132] = addr(cd[((32 * idx) + cd)
                call addr(cd).0xbf92857c with:
                    gas gas_remaining wei
                    args addr(cd[((32 * idx) + cd)
                if not ext_call.success:
                    require idx < ('cd', 4).length
                    mem[(32 * idx) + 128] = 0
                else:
                    require ext_code.size(addr(cd))
                    call addr(cd).0xbf92857c with:
                        gas gas_remaining wei
                        args addr(cd[((32 * idx) + cd)
                    mem[(32 * ('cd', 4).length) + 128 len 192] = ext_call.return_data[0 len 192]
                    if not ext_call.success:
                        revert with ext_call.return_data[0 len return_data.size]
                    require return_data.size >= 192
                    require idx < ('cd', 4).length
                    mem[(32 * idx) + 128] = ext_call.return_data[160]
        idx = idx + 1
        continue 
    mem[(32 * ('cd', 4).length) + 192 len floor32(('cd', 4).length)] = mem[128 len floor32(('cd', 4).length)]
    return Array(len=('cd', 4).length, data=mem[128 len floor32(('cd', 4).length)], mem[(32 * ('cd', 4).length) + floor32(('cd', 4).length) + 192 len (32 * ('cd', 4).length) - floor32(('cd', 4).length)]), 

}



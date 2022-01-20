import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MOKToken is ERC20 {
    constructor() ERC20("MOK Token", "MOK") {
        _mint(msg.sender, 1000*10**18);
    }
}
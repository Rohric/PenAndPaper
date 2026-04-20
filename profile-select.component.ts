import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-profile-select",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./profile-select.component.html",
  styleUrls: ["./profile-select.component.scss"],
})
export class ProfileSelectComponent {}
